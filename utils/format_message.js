// script formatting the Slack deployment message

const ownerWithRepositoryName = process.env.GITHUB_REPOSITORY;
const repositoryName = process.env.GITHUB_REPOSITORY.replace('fleetactions/', '');
const branchName = process.env.GITHUB_REF_NAME;
const commitHash = process.env.GITHUB_SHA;
const userName = process.env.GITHUB_ACTOR;
const environmentName = process.env.ACTION_ENVIRONMENT;
const deploymentType = (process.env.ACTION_DEPLOYMENT_TYPE) ? process.env.ACTION_DEPLOYMENT_TYPE : '';

const branchUrl = `https://github.com/${ownerWithRepositoryName}/tree/${branchName}`;
const commitUrl = `https://github.com/${ownerWithRepositoryName}/commit/${commitHash}`;
const userUrl = `https://github.com/${userName}`;

const firstRow = `*${environmentName}* | *${repositoryName}* | *${deploymentType}*`.toUpperCase().replace(/ \| \*\*/g, '');
const secondRow = `Branch <${branchUrl}|${branchName}> (<${commitUrl}|${commitHash.substring(0,7)}>)`;
const thirdRow = `Deployed by <${userUrl}|@${userName}>`;

const message = `${firstRow}\n${secondRow}\n${thirdRow}`;

console.log(message);
