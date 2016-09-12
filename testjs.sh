export MOCHA_FILE=$CIRCLE_TEST_REPORTS/junit/test-results.xml
cd portal
npm install
npm test
