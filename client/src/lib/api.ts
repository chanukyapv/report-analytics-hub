
// Basic API request functions

export async function loginUser(credentials: { email: string; password: string }) {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          mutation Login($email: String!, $password: String!) {
            login(email: $email, password: $password) {
              token
              user {
                id
                name
                email
                role
              }
            }
          }
        `,
        variables: {
          email: credentials.email,
          password: credentials.password,
        },
      }),
    });

    const data = await response.json();
    
    if (data.errors) {
      throw new Error(data.errors[0].message || 'Login failed');
    }
    
    return data.data.login;
  } catch (error) {
    throw error;
  }
}

export async function registerUser(userData: { name: string; email: string; password: string }) {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          mutation Register($name: String!, $email: String!, $password: String!) {
            register(input: { name: $name, email: $email, password: $password }) {
              token
              user {
                id
                name
                email
                role
              }
            }
          }
        `,
        variables: {
          name: userData.name,
          email: userData.email,
          password: userData.password,
        },
      }),
    });

    const data = await response.json();
    
    if (data.errors) {
      throw new Error(data.errors[0].message || 'Registration failed');
    }
    
    return data.data.register;
  } catch (error) {
    throw error;
  }
}

// Function to get user data with token
export async function getUserData(token: string) {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        query: `
          query {
            me {
              id
              name
              email
              role
              lastLogin
            }
          }
        `
      }),
    });

    const data = await response.json();
    
    if (data.errors) {
      throw new Error(data.errors[0].message || 'Failed to fetch user data');
    }
    
    return data.data.me;
  } catch (error) {
    throw error;
  }
}
