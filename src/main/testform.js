// Form.js
import React, { useState } from 'react';

function Form() {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (event) => {
    console.log(`A name was submitted: ${inputValue}`);
    event.preventDefault();
    // window.location.href = `/chat/${inputValue}`; // Redirect to the root route
    window.location.href = `/models`; // Redirect to the root route
  };

  const handleChange = (event) => {
    setInputValue(event.target.value);
  };

  return (
    <form onSubmit={handleSubmit}>
      {inputValue}
      <input type="text" value={inputValue} onChange={handleChange} />
      <button type="submit">Submit</button>
    </form>
  );
}

export default Form;
