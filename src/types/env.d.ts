declare namespace NodeJS{
    interface ProcessEnv{
        DB_USER: string;
        DB_PASSWORD: string;
        DB_HOST: string;
        DB_PORT: string; // Use string if you want to keep it consistent with process.env
        DB_NAME: string;
        SECRET_KEY: string;
    }
}