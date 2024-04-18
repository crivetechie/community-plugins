/*
 * Copyright 2023 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { Entity } from '@backstage/catalog-model';
import { ConfigReader } from '@backstage/config';
import { AzureDevOpsAnnotatorProcessor } from './AzureDevOpsAnnotatorProcessor';
import { LocationSpec } from '@backstage/plugin-catalog-common';

describe('AzureDevOpsAnnotatorProcessor', () => {
  it('adds annotation', async () => {
    const entity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: 'my-component',
      },
    };
    const location: LocationSpec = {
      type: 'url',
      target:
        'https://dev.azure.com/organization/project/_git/repository?path=%2Fcatalog-info.yaml',
    };

    const processor = AzureDevOpsAnnotatorProcessor.fromConfig(
      new ConfigReader({}),
    );

    expect(await processor.preProcessEntity(entity, location)).toEqual({
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: 'my-component',
        annotations: {
          'dev.azure.com/host-org': 'dev.azure.com/organization',
          'dev.azure.com/project-repo': 'project/repository',
        },
      },
    });
  });

  it('adds annotation for Azure DevOps Server url', async () => {
    const entity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: 'my-component',
      },
    };
    const location: LocationSpec = {
      type: 'url',
      target:
        'https://example.com/organization/project/_git/repository?path=%2Fcatalog-info.yaml',
    };

    const processor = AzureDevOpsAnnotatorProcessor.fromConfig(
      new ConfigReader({
        integrations: {
          azure: [
            {
              host: 'example.com',
              credentials: [
                {
                  personalAccessToken: 'pat',
                },
              ],
            },
          ],
        },
      }),
    );

    expect(await processor.preProcessEntity(entity, location)).toEqual({
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: 'my-component',
        annotations: {
          'dev.azure.com/host-org': 'example.com/organization',
          'dev.azure.com/project-repo': 'project/repository',
        },
      },
    });
  });

  it('adds annotation for TFS subpath url', async () => {
    const entity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: 'my-component',
      },
    };
    const location: LocationSpec = {
      type: 'url',
      target:
        'https://example.com/tfs/organization/project/_git/repository?path=%2Fcatalog-info.yaml',
    };

    const processor = AzureDevOpsAnnotatorProcessor.fromConfig(
      new ConfigReader({
        integrations: {
          azure: [
            {
              host: 'example.com',
              credentials: [
                {
                  personalAccessToken: 'pat',
                },
              ],
            },
          ],
        },
      }),
    );

    expect(await processor.preProcessEntity(entity, location)).toEqual({
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: 'my-component',
        annotations: {
          'dev.azure.com/host-org': 'example.com/tfs/organization',
          'dev.azure.com/project-repo': 'project/repository',
        },
      },
    });
  });

  it('does not override existing annotation', async () => {
    const entity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: 'my-component',
        annotations: {
          'dev.azure.com/host-org': 'myhost/myorg',
          'dev.azure.com/project-repo': 'myproj/myrepo',
        },
      },
    };
    const location: LocationSpec = {
      type: 'url',
      target:
        'https://dev.azure.com/organization/project/_git/repository?path=%2Fcatalog-info.yaml',
    };

    const processor = AzureDevOpsAnnotatorProcessor.fromConfig(
      new ConfigReader({}),
    );

    expect(await processor.preProcessEntity(entity, location)).toEqual({
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: 'my-component',
        annotations: {
          'dev.azure.com/host-org': 'myhost/myorg',
          'dev.azure.com/project-repo': 'myproj/myrepo',
        },
      },
    });
  });

  it('should not add annotation for other providers', async () => {
    const entity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: 'my-component',
      },
    };
    const location: LocationSpec = {
      type: 'url',
      target:
        'https://not-in-mock-config.example.com/backstage/backstage/-/blob/master/catalog-info.yaml',
    };

    const processor = AzureDevOpsAnnotatorProcessor.fromConfig(
      new ConfigReader({}),
    );

    expect(await processor.preProcessEntity(entity, location)).toEqual({
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: 'my-component',
      },
    });
  });

  it('should only process applicable kinds', async () => {
    const component: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: 'my-component',
      },
    };

    const api: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'API',
      metadata: {
        name: 'my-component',
      },
    };

    const system: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'System',
      metadata: {
        name: 'my-component',
      },
    };

    const location: LocationSpec = {
      type: 'url',
      target:
        'https://dev.azure.com/organization/project/_git/repository?path=%2Fcatalog-info.yaml',
    };

    const processor = AzureDevOpsAnnotatorProcessor.fromConfig(
      new ConfigReader({}),
      { kinds: ['API', 'Component'] },
    );

    expect(await processor.preProcessEntity(component, location)).toEqual({
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: 'my-component',
        annotations: {
          'dev.azure.com/host-org': 'dev.azure.com/organization',
          'dev.azure.com/project-repo': 'project/repository',
        },
      },
    });

    expect(await processor.preProcessEntity(api, location)).toEqual({
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'API',
      metadata: {
        name: 'my-component',
        annotations: {
          'dev.azure.com/host-org': 'dev.azure.com/organization',
          'dev.azure.com/project-repo': 'project/repository',
        },
      },
    });

    expect(await processor.preProcessEntity(system, location)).toEqual({
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'System',
      metadata: {
        name: 'my-component',
      },
    });
  });
});
