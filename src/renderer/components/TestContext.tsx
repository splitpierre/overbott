import React, { createContext, useContext, useMemo, useState } from 'react';

export const ExampleContext = createContext({
  username: 'Israel',
  password: '',
  setUsername: (name: string) => {},
  setPassword: (password: string) => {},
});

interface Props {
  children: React.ReactNode;
}

export function ExampleProvider({ children }: Props) {
  const [username, setUsername] = useState('Chibuzor');
  const [password, setPassword] = useState('');
  const value = useMemo(
    () => ({ username, password, setUsername, setPassword }),
    [username, password],
  );
  return (
    <ExampleContext.Provider value={value}>{children}</ExampleContext.Provider>
  );
}

export function Greet() {
  const { username, password, setUsername, setPassword } =
    useContext(ExampleContext);

  const handleUsernameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(event.target.value);
  };

  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
  };

  return (
    <div>
      <h1>Hello, {username}</h1>
      <input type="text" value={username} onChange={handleUsernameChange} />
      <input type="password" value={password} onChange={handlePasswordChange} />
    </div>
  );
}
