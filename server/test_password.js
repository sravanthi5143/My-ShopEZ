const bcrypt = require('bcryptjs');

const hash = '$2b$10$xzTH8GWNYsEuP3y6bi90wO/N7ISCPuy8cRP.7OjL1YKgmq5PGjsTu';
const enteredPassword = '123456';

bcrypt.compare(enteredPassword, hash).then(match => {
  console.log('Password match status for "123456":', match);
});
