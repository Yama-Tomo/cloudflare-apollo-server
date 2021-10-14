import { doRequest } from './request_helper';

describe('example', () => {
  it('should be correct calculation', () => {
    expect(1 + 2).toBe(3);
  });

  it('should be correct response', async () => {
    const response = await doRequest(`query ExampleQuery { hello }`);
    expect(response).toEqual({ data: { hello: 'Hello world!' } });
  }, 10000);

  describe('give `agent-number` header', () => {
    it('should be correct response', async () => {
      const response = await doRequest(`query ExampleQuery { hello }`, {
        headers: { 'agent-number': '007' },
      });

      expect(response).toEqual({ data: { hello: 'James Bond Hello world!' } });
    }, 10000);
  });
});
