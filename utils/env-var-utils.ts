import {CustomValue, ENVIRONMENT, ParameterSource} from "./configuration";
import {StringParameter} from "aws-cdk-lib/aws-ssm";
import {Construct} from "constructs";
import {IStringParameter} from "aws-cdk-lib/aws-ssm";
import {Secret} from "aws-cdk-lib/aws-secretsmanager";
import {ISecret} from "aws-cdk-lib/aws-secretsmanager";
import {ResourceUtils} from "./resource-identifiers";
import {Constants} from "./constants";

export class EnvironmentVariableUtils {

    parseEnvironmentVariables(envs: ENVIRONMENT, scope: Construct): {[key: string]: any} {
        const result: { [key: string]: string } = {};

        for (const key of Object.keys(envs)) {
            const value = envs[key];
            if (typeof value === 'string') {
                result[key] = value;
            } else {
                switch (value.source) {
                    case ParameterSource.PARAMETER_STORE:
                        this.handleParameterStore(value, scope, result, key);
                        break;
                    case ParameterSource.SECRETS_MANAGER:
                        this.handleSecretsManager(value, scope, result, key);
                        break;

                }
            }

        }

        return result;
    }

    private handleParameterStore(value: CustomValue, scope: Construct, result: {
        [p: string]: string
    }, key: string) {
        let paramValue;
        if (ResourceUtils.resources[value.key + Constants.PARAMETER_SUFFIX] != null) {
            paramValue = (ResourceUtils.resources[value.key + Constants.PARAMETER_SUFFIX] as IStringParameter).stringValue;
        } else {
            const param = StringParameter.fromStringParameterName(scope, `StringParameter${value.key}`, value.key);
            paramValue = param.stringValue
            ResourceUtils.resources[value.key + Constants.PARAMETER_SUFFIX] = param;
        }
        result[key] = paramValue;
    }


    private handleSecretsManager(value: CustomValue, scope: Construct, result: {
        [p: string]: string | IStringParameter
    }, key: string) {
        let secretValue;
        if (ResourceUtils.resources[value.key + Constants.SECRET_SUFFIX] != null) {
            secretValue = (ResourceUtils.resources[value.key + Constants.SECRET_SUFFIX] as ISecret).secretValue.unsafeUnwrap();
        } else {
            const secret = Secret.fromSecretNameV2(scope, `Secret${value.key}`, value.key);
            secretValue = secret.secretValue.unsafeUnwrap();
            ResourceUtils.resources[value.key + Constants.SECRET_SUFFIX] = secret;
        }
        result[key] = secretValue;
    }
}

