export interface GoogleTaskList {
    kind: string;
    id: string;
    etag: string;
    title: string;
    updated: string;
    selfLink: string;
}

export interface GoogleTask {
    kind: string;
    id: string;
    etag: string;
    title: string;
    updated: string;
    selfLink: string;
    parent?: string;
    position?: string;
    notes?: string;
    status: 'needsAction' | 'completed';
    due?: string;
    completed?: string;
    deleted?: boolean;
    hidden?: boolean;
    links?: {
        type: string;
        description: string;
        link: string;
    }[];
}

export interface ExtendedTask extends GoogleTask {
    interval?: number; // Custom field parsed from notes
}
