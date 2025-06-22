import {IResource, Resource} from "aws-cdk-lib/core";

export enum RESOURCES {
    API_GATEWAY = "api_gateway",
    STAGE_PARAM = "stage_param"
}

export enum LAMBDA_FUNCTIONS {
    GET_ALL_USERS_FUNCTION = "get_all_users_function",
    GET_EVENTS_FOR_USER_FUNCTION = "get_events_for_user_function"
}

export enum AUTHORIZERS {
    AUTHORIZER_FUNCTION = "authorizer_function",
    ADMIN_AUTHORIZER_FUNCTION = "admin_authorizer_function"
}

export type RESOURCE_IDENTIFIER = RESOURCES | LAMBDA_FUNCTIONS | AUTHORIZERS;

export class ResourceUtils {
    static resources: {[key: string]: IResource} = {};
}