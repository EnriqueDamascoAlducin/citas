export type * from './auth';
export type * from './navigation';
export type * from './ui';

export type Service = {
    id: number;
    name: string;
    description: string | null;
    duration_minutes: number;
    price: string | number;
    active: boolean;
    created_at: string;
    updated_at: string;
};
