 # cdk-prism

Simple CDK application to create OpenAPI mock with [prism](https://github.com/stoplightio/prism).

## Getting Started

### Prerequisites

- nodejs 10.3.0 or later

### Usage

```sh
# Create and edit cdk.json for settings
cp cdk.json.example cdk.json
```

| Variable | Required | Details |
| --- | --- | --- |
| account | * | *| AWS Account |
| region |  | AWS Region |
| hostedZoneId | * | Hosted zone id Amazon Route 53 issued |
| hostedZoneName | * | Domain name Amazon Route 53 issued |
| bucketSubdomain | * | Subdomain to host static documents |
| mockSubdomain | * | Subdomain for prism |
| vpcId |  | VPC Id (Keeping it blank to create new VPC) |
| ipAddressAllowlist |  | Allowed Ip list |

```sh
# Deployment
npm install
npx cdk diff -c env=production
npx cdk deploy -c env=production

# Run snapshot tests
npm test
```

# License
This software is released under the MIT License, see LICENSE.
