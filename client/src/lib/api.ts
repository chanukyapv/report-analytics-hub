
// API utility functions to interact with GraphQL backend

const API_URL = "http://localhost:8000/graphql";

// Helper function for GraphQL requests
async function fetchGraphQL(query: string, variables = {}, token?: string) {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  const response = await fetch(API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query,
      variables,
    }),
  });
  
  const json = await response.json();
  
  if (json.errors) {
    console.error('GraphQL Error:', json.errors);
    throw new Error(json.errors[0].message);
  }
  
  return json.data;
}

// Auth functions
export async function loginUser(email: string, password: string) {
  const query = `
    mutation Login($email: String!, $password: String!) {
      login(email: $email, password: $password) {
        token
        user {
          id
          email
          name
          role
          is_active
        }
      }
    }
  `;
  
  const data = await fetchGraphQL(query, { email, password });
  return data.login;
}

export async function registerUser(input: { name: string; email: string; password: string; }) {
  const query = `
    mutation Register($input: RegisterInput!) {
      register(input: $input) {
        token
        user {
          id
          email
          name
          role
          is_active
        }
      }
    }
  `;
  
  const data = await fetchGraphQL(query, { input });
  return data.register;
}

export async function getCurrentUser(token: string) {
  const query = `
    query {
      me {
        id
        email
        name
        role
        is_active
      }
    }
  `;
  
  const data = await fetchGraphQL(query, {}, token);
  return data.me;
}
