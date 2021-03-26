import * as acm from '@aws-cdk/aws-certificatemanager';
import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecs from '@aws-cdk/aws-ecs';
import * as ecs_patterns from '@aws-cdk/aws-ecs-patterns';
import * as route53 from '@aws-cdk/aws-route53';
import * as targets from '@aws-cdk/aws-route53-targets';
import * as s3 from '@aws-cdk/aws-s3';

export interface PrismStackProps extends cdk.StackProps {
  hostedZoneId: string;
  hostedZoneName: string;
  bucketSubdomain: string;
  mockSubdomain: string;
  vpcId?: string;
  ipAddressAllowlist?: string[];
}

export class PrismStack extends cdk.Stack {

  constructor(scope: cdk.App, id: string, props: PrismStackProps) {
    super(scope, id, props);

    const bucketName = `${props.bucketSubdomain}.${props.hostedZoneName}`;
    const mockFqdn = `${props.mockSubdomain}.${props.hostedZoneName}`;

    // モックサーバーを構築するVPC
    let vpc;
    if (props.vpcId) {
      vpc = ec2.Vpc.fromLookup(this, 'MockVpc', {
        vpcId: props.vpcId
      });
    }

    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
      hostedZoneId: props.hostedZoneId,
      zoneName: props.hostedZoneName
    });

    const mockCertificate = new acm.DnsValidatedCertificate(this, 'MockCertificate', {
      domainName: mockFqdn,
      hostedZone: hostedZone,
      region: props.env?.region
    });

    // Fargate + ALBの作成
    const mockTaskDefinition = new ecs.FargateTaskDefinition(this, 'MockTaskDefinition', {
      family: 'MockServer',
    });
    const mockContainerDefinition = mockTaskDefinition.addContainer('MockContainerDefinition', {
      image: ecs.ContainerImage.fromAsset('./prism'),
    });
    mockContainerDefinition.addPortMappings({
      containerPort: 80
    });

    const mockFargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'MockFargateService', {
      vpc: vpc,
      assignPublicIp: true,
      taskDefinition: mockTaskDefinition,
      certificate: mockCertificate,
      domainName: mockFqdn,
      domainZone: hostedZone,
      openListener: props.ipAddressAllowlist == null,
    });

    // サーバーエラー以外のレスポンスコードが返ってきてもヘルスチェックを通す
    // モックサーバーのルートが常に200を返すとは限らないため
    mockFargateService.targetGroup.configureHealthCheck({
      healthyHttpCodes: '200-499'
    });


    // 静的ドキュメントを配置するS3バケット
    const documentBucket = new s3.Bucket(this, 'DocumentBucket', {
      bucketName: bucketName,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      websiteIndexDocument: 'index.html',
    });
    const documentBucketGrant = documentBucket.grantPublicAccess();

    const documentAliasRecord = new route53.ARecord(this, 'DocumentAliasRecord', {
      zone: hostedZone,
      recordName: bucketName,
      target: route53.RecordTarget.fromAlias(new targets.BucketWebsiteTarget(documentBucket))
    });

    // IPアドレス制限の追加
    if (props.ipAddressAllowlist != null) {
      const securityGroup = new ec2.SecurityGroup(this, 'MockIpAddressRestriction', {
        vpc: mockFargateService.loadBalancer.vpc
      });
      for (const ipAddress of props.ipAddressAllowlist) {
        securityGroup.addIngressRule(ec2.Peer.ipv4(ipAddress), ec2.Port.tcp(443));
      }
      mockFargateService.loadBalancer.addSecurityGroup(securityGroup);

      documentBucketGrant.resourceStatement!.addCondition('IpAddress', { 'aws:SourceIp': props.ipAddressAllowlist });
    }

    new cdk.CfnOutput(this, 'OutputDocumentAddress', {
      value: `http://${documentAliasRecord.domainName}`
    });
  }
}
