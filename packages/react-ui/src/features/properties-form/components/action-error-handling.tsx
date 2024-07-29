import React from 'react';
import { useFormContext } from 'react-hook-form';

import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
} from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { CodeAction } from '@activepieces/shared';

import { ReadMoreDescription } from './read-more-description';

type ActionErrorHandlingFormProps = {
  hideContinueOnFailure?: boolean;
  hideRetryOnFailure?: boolean;
};

const ActionErrorHandlingForm = React.memo(
  ({
    hideContinueOnFailure,
    hideRetryOnFailure,
  }: ActionErrorHandlingFormProps) => {
    const errorHandlingOptionsForm = useFormContext<CodeAction>();

    return (
      <div className="grid gap-4">
        {hideContinueOnFailure !== true && (
          <FormField
            name="settings.errorHandlingOptions.continueOnFailure.value"
            control={errorHandlingOptionsForm.control}
            render={({ field }) => (
              <FormItem className="flex flex-col items-start justify-between">
                <FormLabel
                  htmlFor="continueOnFailure"
                  className="flex items-center justify-center"
                >
                  <FormControl>
                    <Switch
                      id="continueOnFailure"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <span className="ml-3 flex-grow">Continue on Failure</span>
                </FormLabel>
                <ReadMoreDescription text="Enable this option to skip this step and continue the flow normally if it fails." />
              </FormItem>
            )}
          />
        )}
        {hideRetryOnFailure !== true && (
          <FormField
            name="settings.errorHandlingOptions.retryOnFailure.value"
            control={errorHandlingOptionsForm.control}
            render={({ field }) => (
              <FormItem className="flex flex-col items-start justify-between">
                <FormLabel
                  htmlFor="retryOnFailure"
                  className="flex items-center justify-center"
                >
                  <FormControl>
                    <Switch
                      id="retryOnFailure"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <span className="ml-3 grow">Retry on Failure</span>
                </FormLabel>
                <ReadMoreDescription text="Automatically retry up to four attempts when failed." />
              </FormItem>
            )}
          />
        )}
      </div>
    );
  },
);

ActionErrorHandlingForm.displayName = 'ActionErrorHandlingForm';
export { ActionErrorHandlingForm };
