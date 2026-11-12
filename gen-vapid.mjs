import { generateVAPIDKeys } from 'web-push';
const k = generateVAPIDKeys();
console.log('PUBLIC:' + k.publicKey);
console.log('PRIVATE:' + k.privateKey);
