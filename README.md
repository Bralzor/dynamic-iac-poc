# Welcome to Voluntario CDK Prototype

This is a small PoC for creating AWS Infrastructure in a more developer-friendly way. It is not a complete solution and depends on an externally configured database. This is meant as a reference for different ways to configure CDK-based infrastructures. 

## Util files

* `configuration.ts` contains the classes representing the different resources that can be configured via `config.ts` files
* `constants.ts` contains different constants used in the app
* `directory-parser.ts` parses and loads all config files into a map to be used when setting up the infrastructure
* `env-var-utils.ts` handles injecting parameters/secrets as environment variables for lambda functions
* `resource-identifiers.ts` provides constants that represent identifiers of different resources so they can be easily refferenced in config files




`npm run deploy`
to build all of the code and deploy the stack to an aws account