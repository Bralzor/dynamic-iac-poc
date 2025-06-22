import { Client } from 'pg';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import {User} from "../../data/User";

export const handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
    const client = new Client(JSON.parse(process.env.db_credentials as string));

    await client.connect();

    const result = await client.query<User>("SELECT name, email, phone_number, birth_date, approved, total_hours FROM users WHERE admin != true");

    for (const user of result.rows) {
        const eventsResult = await client.query<Event>(`SELECT event_registration.id, events.name, event_registration.start_date, event_registration.duration FROM event_registration
                                               INNER JOIN events ON event_registration.event_id = events.id
                                               WHERE event_registration.user_email = $1`, [user.email]);

        user.status = { events: eventsResult.rows };
    }

    await client.end();

    return {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Headers": 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
        },
        body: JSON.stringify(result.rows)
    };
};