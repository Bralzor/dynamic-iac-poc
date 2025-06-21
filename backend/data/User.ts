export interface User {
    name: string;
    email: string;
    phone_number: string;
    birth_date: string;
    approved: boolean;
    total_hours: number;
    status?: {
        events: Event[];
    };
}