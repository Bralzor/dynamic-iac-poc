#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import {VoluntarioBackendStack} from "../lib/voluntario-backend-stack";

const app = new cdk.App();
new VoluntarioBackendStack(app, 'VoluntarioBackendStack', {
    env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});
