import * as ec2 from '@aws-cdk/aws-ec2';
import { SynthUtils } from "@aws-cdk/assert";
import * as cdk from '@aws-cdk/core';
import { Construct } from "constructs";
import { PrismStack } from '../lib/prism-stack';

test('Create OpenAPI Mock to existing VPC', () => {
  jest.spyOn(ec2.Vpc, "fromLookup").mockImplementation((scope: Construct) => {
    return new ec2.Vpc(scope, "Vpc", {
      cidr: '192.168.0.0/16',
      maxAzs: 2,
      subnetConfiguration: [{
        cidrMask: 26,
        name: 'isolatedSubnet',
        subnetType: ec2.SubnetType.PUBLIC,
      }],
      natGateways: 0
    })
  })

  const app = new cdk.App();
  const stack = new PrismStack(app, 'PrismStack', {
    env: {
        account: '1234567890',
        region: 'ap-northeast-1',
    },
    hostedZoneId: 'dummy',
    hostedZoneName: 'dummy',
    bucketSubdomain: 'dummy',
    mockSubdomain: 'dummy',
  });

  expect(SynthUtils.toCloudFormation(stack)).toMatchSnapshot();
});
