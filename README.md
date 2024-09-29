# savvy-backend
the backend for savvy

## Getting Started

### 1. Clone the Repository

```sh
git clone <repository-url>
cd <repository-directory>
```
### 2. Install dependencies

```sh 
pnpm install
```
### 3. Set Up Environment Variables
Create a .env file in the root directory and add your Supabase URL and Key:

```sh
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-key
PORT=3000
```

### CORS Configuration
The backend is configured to accept requests from `http://localhost:5173.` You can change this in the `index.ts` file if needed.

```sh
app.use(cors({ origin: "http://localhost:5173" }));
```