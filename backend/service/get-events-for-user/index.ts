import { Client } from 'pg';
import { verify } from 'jsonwebtoken';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const secret: string = process.env.jwt_secret!;

interface DecodedToken {
    email: string;
    [key: string]: any;
}

interface EventRegistration {
    id: number;
    name: string;
    start_date: Date;
    duration: number;
}

interface TopVolunteer {
    name: string;
    email: string;
    total_hours: number;
}

interface ResponseBody {
    events: EventRegistration[];
    totalDuration: number;
    topVolunteer: TopVolunteer;
}

export const handler = async (event: APIGatewayProxyEvent, context: any): Promise<APIGatewayProxyResult> => {
    try {
        const authHeader = event.headers?.Authorization;
        if (!authHeader) {
            throw new Error('Authorization header is missing');
        }

        const decoded = verify(authHeader, secret) as DecodedToken;

        const client = new Client(process.env.db_credentials);

        await client.connect();

        // Save the data in the table
        const result = await client.query<EventRegistration>(
            `SELECT event_registration.id, events.name, event_registration.start_date, event_registration.duration 
       FROM event_registration
       INNER JOIN events ON event_registration.event_id = events.id
       WHERE event_registration.user_email = $1`,
            [decoded.email]
        );

        const resultUser = await client.query<TopVolunteer>(
            "SELECT name, email, total_hours FROM users ORDER BY total_hours DESC limit 1"
        );

        let totalDuration = 0;

        for (const entry of result.rows) {
            totalDuration += entry.duration;
        }

        await client.end();

        const responseBody: ResponseBody = {
            events: result.rows,
            totalDuration: totalDuration,
            topVolunteer: resultUser.rows[0]
        };

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Headers": 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
            },
            body: JSON.stringify(responseBody)
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Headers": 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
            },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};