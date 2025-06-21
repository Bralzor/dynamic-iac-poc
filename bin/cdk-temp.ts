#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { VoluntarioBackendStack } from '../lib/voluntario-backend-stack';
import {ResourcesConfiguration} from "../utils/configuration";
import {loadConfigs} from "../utils/directory-parser";
import path from "path";

export interface VoluntarioStackProps extends cdk.StackProps {
    authorizerConfig: ResourcesConfiguration;
}

// const authorizerConfig: ResourcesConfiguration = await loadConfigs(path.resolve(__dirname, '../backend/authorizer'));

const app = new cdk.App();
new VoluntarioBackendStack(app, 'CdkTempStack', {
    env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
    // env: { account: '123456789012', region: 'us-east-1' },
});
