# Welcome to the "Put the `code` back in Infrastructure as Code" CDK Prototype.

## Based on feedback and discussions I've had after my first presentation of this concept I will be refactoring and restructuring a lot of the code I've written so far, so be aware that the repo might change a lot in the next couple of weeks

This is a small PoC for creating AWS Infrastructure in a more developer-friendly way. It is not a complete solution and depends on an externally configured database. This is meant as a reference for different ways to configure CDK-based infrastructures. 

## Util files

* `configuration.ts` contains the classes representing the different resources that can be configured via `config.ts` files
* `constants.ts` contains different constants used in the app
* `directory-parser.ts` parses and loads all config files into a map to be used when setting up the infrastructure
* `env-var-utils.ts` handles injecting parameters/secrets as environment variables for lambda functions
* `resource-identifiers.ts` provides constants that represent identifiers of different resources so they can be easily refferenced in config files


TODOs:
* Deeper use of the configuration classes, rename to something else (ResourceModule? ResourceAssembly?)
  * Move a lot of the code from CDK to the above mentioned classes
* Handle dependencies between resources by using a pseudo-singleton approach
* Look into Projen.io for CLI solution
* Add some documentation on purpose and goals of project
