mkdir $CIRCLE_TEST_REPORTS/portal
export MOCHA_FILE=$CIRCLE_TEST_REPORTS/portal/junit.xml
cd portal
npm install
npm test
