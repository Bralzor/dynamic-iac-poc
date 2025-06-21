import {CustomValue, ENVIRONMENT, ParameterSource} from "./configuration";
import {StringParameter} from "aws-cdk-lib/aws-ssm";
import {Construct} from "constructs";
import {IStringParameter} from "aws-cdk-lib/aws-ssm";
import {Secret} from "aws-cdk-lib/aws-secretsmanager";
import {ISecret} from "aws-cdk-lib/aws-secretsmanager";

export class EnvironmentVariableUtils {
    parameters: {[key: string]: IStringParameter} = {};
    secrets: {[key: string]: ISecret} = {};

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
        if (this.parameters[value.key] != null) {
            paramValue = this.parameters[value.key].stringValue;
        } else {
            const param = StringParameter.fromStringParameterName(scope, `StringParameter${value.key}`, value.key);
            paramValue = param.stringValue
            this.parameters[value.key] = param;
        }
        result[key] = paramValue;
    }


    private handleSecretsManager(value: CustomValue, scope: Construct, result: {
        [p: string]: string | IStringParameter
    }, key: string) {
        let secretValue;
        if (this.secrets[value.key] != null) {
            secretValue = this.secrets[value.key].secretValue.toString();
        } else {
            const secret = Secret.fromSecretNameV2(scope, `Secret${value.key}`, value.key);
            secretValue = secret.secretValue.toString();
            this.secrets[value.key] = secret;
        }
        result[key] = secretValue;
    }
}

