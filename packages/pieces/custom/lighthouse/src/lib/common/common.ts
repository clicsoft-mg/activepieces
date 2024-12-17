export const decode = (body: string) => {
  console.log('decode', body);
  const jsonString = atob(body); // Decode Base64 string to JSON string
  return JSON.parse(jsonString); // Parse JSON string back to object
};
