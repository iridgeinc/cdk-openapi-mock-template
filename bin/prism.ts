#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import { PrismStack } from '../lib/prism-stack';

const app = new cdk.App();
const env = app.node.tryGetContext('env');

if (env == null) {
  throw Error('Needs to specify context "env"');
}

new PrismStack(app, 'PrismStack', app.node.tryGetContext(env));
