import * as fs from 'fs';
import * as path from 'path';
import {ResourceConfiguration, ResourcesConfiguration} from "./configuration";
import {Construct} from "constructs";
import * as cdk from "aws-cdk-lib";
import {Resource} from "aws-cdk-lib/core";

type ConfigModule = {
    config: (scope: Construct, props?: cdk.StackProps) => ResourceConfiguration;
    extend: (resource: Resource, scope: Construct, props?: cdk.StackProps) => void;
};

export async function loadConfigs(rootPath: string): Promise<ResourcesConfiguration> {
    const configurations: ResourcesConfiguration = {};

    const subfolders = fs.readdirSync(rootPath, {withFileTypes: true})
        .filter(subfolder => subfolder.isDirectory())
        .map(dirent => dirent.name);

    for (const folder of subfolders) {
        const configPath = path.join(rootPath, folder, 'config.ts');
        const configJsPath = path.join(rootPath, folder, 'config.js');
        const finalConfigPath = fs.existsSync(configJsPath) ? configJsPath : configPath;

        const pckgPath = path.join(rootPath, folder, 'package.json');

        if (fs.existsSync(finalConfigPath)) {
            try {
                const configModule = (await import(finalConfigPath)) as ConfigModule;
                const packageJsonRaw = fs.readFileSync(pckgPath, {encoding: "utf-8"});
                const packageJson = JSON.parse(packageJsonRaw);

                configurations[packageJson.name] = {
                    config: configModule.config,
                    extend: configModule.extend,
                    pckg: packageJson,
                    distPath: path.join(rootPath, folder, 'dist')
                };
            } catch (err) {
                console.error(`Failed to load config from ${finalConfigPath}`, err);
            }
        }
    }

    return configurations;
}
