/**
 * @jest-environment node
 */
const { NextRequest } = require('next/server');

describe('NextRequest in Jest', () => {
  it('should have headers', () => {
    const headers = new Headers();
    headers.set('X-Test', 'value');
    const request = new NextRequest('http://localhost/test', { headers });
    
    console.log('headers:', request.headers);
    console.log('headers.get:', request.headers?.get);
    console.log('headers.get("X-Test"):', request.headers?.get('X-Test'));
    
    expect(request.headers).toBeDefined();
    expect(request.headers.get('X-Test')).toBe('value');
  });
});
