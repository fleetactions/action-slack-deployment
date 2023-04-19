import * as core from '@actions/core';

import { ActionClient } from './client';

export const run = async (): Promise<void> => {
  try {
    const client = new ActionClient({
      workflowStatus: core.getInput('workflow-status', { required: true }),
      environmentName: core.getInput('environment-name', { required: true }),
      deploymentType: core.getInput('deployment-type', { required: false }),
      slackWebhookUrl: core.getInput('slack-webhook-url', { required: true }),
    });

    await client.sendMessage();
  } catch (error) {
    core.setFailed((error as Error).message);
  }
};
