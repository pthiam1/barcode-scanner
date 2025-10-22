import 'dotenv/config';

export default ({ config }) => {
  return {
    ...config,
    extra: {
      API_URL: process.env.API_URL,
      USER_ID: process.env.USER_ID,
    },
  };
};
