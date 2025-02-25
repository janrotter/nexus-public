/*
 * Sonatype Nexus (TM) Open Source Version
 * Copyright (c) 2008-present Sonatype, Inc.
 * All rights reserved. Includes the third-party code listed at http://links.sonatype.com/products/nexus/oss/attributions.
 *
 * This program and the accompanying materials are made available under the terms of the Eclipse Public License Version 1.0,
 * which accompanies this distribution and is available at http://www.eclipse.org/legal/epl-v10.html.
 *
 * Sonatype Nexus (TM) Professional Version is available from Sonatype, Inc. "Sonatype" and "Sonatype Nexus" are trademarks
 * of Sonatype, Inc. Apache Maven is a trademark of the Apache Software Foundation. M2eclipse is a trademark of the
 * Eclipse Foundation. All other trademarks are the property of their respective owners.
 */
import React from 'react';
import {render, fireEvent, screen, waitFor, waitForElementToBeRemoved} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {when} from 'jest-when';
import {act} from "react-dom/test-utils";
import '@testing-library/jest-dom/extend-expect';
import TestUtils from '@sonatype/nexus-ui-plugin/src/frontend/src/interface/TestUtils';
import Axios from 'axios';
import {ExtJS} from '@sonatype/nexus-ui-plugin';

import RolesDetails from './RolesDetails';

import UIStrings from '../../../../constants/UIStrings';
import {TYPES, URL} from './RolesHelper';

const {ROLES: {FORM: LABELS}, SETTINGS} = UIStrings;
const {rolesUrl, privilegesUrl, sourcesApi, getRolesUrl, defaultRolesUrl, singleRoleUrl} = URL;

jest.mock('axios', () => ({
  ...jest.requireActual('axios'),
  get: jest.fn(),
  put: jest.fn(),
  post: jest.fn(),
  delete: jest.fn(),
}));

jest.mock('@sonatype/nexus-ui-plugin', () => ({
  ...jest.requireActual('@sonatype/nexus-ui-plugin'),
  ExtJS: {
    requestConfirmation: jest.fn(),
    checkPermission: jest.fn(),
    showErrorMessage: jest.fn(),
    showSuccessMessage: jest.fn(),
  },
}));

global.NX = {
  Messages: {
    success: jest.fn(),
    error: jest.fn(),
  }
};

const testRoleId = 'RoleId';
const testRoleName = 'Test Role Name';
const testRoleDescription = 'Test Role Description';

const ROLE = {
  id: testRoleId,
  name: testRoleName,
  description: testRoleDescription,
  privileges: ['nx-blobstores-all'],
  roles: ['replication-role', 'nx-admin'],
};

const PRIVILEGES = [{
  description: 'All permissions',
  name: 'nx-all',
  pattern: 'nexus:*',
  readOnly: true,
  type: 'wildcard',
}, {
  actions: ['ALL'],
  description: 'All permissions for Blobstores',
  domain: 'blobstores',
  name: 'nx-blobstores-all',
  readOnly: true,
  type: 'application',
}];

const ROLES = {
  'nx-admin': {
    description: 'Administrator Role',
    id: 'nx-admin',
    name: 'nx-admin',
    privileges: ['nx-all'],
    roles: [],
    source: 'default'
  },
  'TestRole': {
    description: 'Test role',
    id: 'TestRole',
    name: 'Test Role name',
    privileges: ['nx-healthcheck-read'],
    roles: [],
    source: 'default',
  },
  'replication-role': {
    description: 'Replication',
    id: 'replication-role',
    name: 'Replication role',
    privileges: ['nx-replication-update'],
    roles: [],
    source: 'default',
  }
};

const CROWD_ROLES = [{
  description: 'crowd-administrators',
  id: 'crowd-administrators',
  name: 'crowd-administrators',
  privileges: [],
  roles: [],
  source: 'Crowd',
}];

const SOURCE_TYPES = {
  SAML: {id: 'SAML', name: 'SAML'},
  Crowd: {id: 'Crowd', name: 'Crowd'},
  LDAP: {id: 'LDAP', name: 'LDAP'},
};

const SOURCE_TYPES_RESP = {
  action: "coreui_ProprietaryRepositories",
  method: "readPossibleRepos",
  tid: 1,
  type: "rpc",
  result: {
    data: Object.values(SOURCE_TYPES),
    success: true,
  }
};

const selectors = {
  ...TestUtils.selectors,
  type: () => screen.queryByLabelText(LABELS.TYPE.LABEL),
  id: () => screen.queryByLabelText(LABELS.ID.LABEL),
  externalRoleType: () => screen.queryByLabelText(LABELS.EXTERNAL_TYPE.LABEL),
  mappedRole: () => screen.queryByLabelText(LABELS.MAPPED_ROLE.LABEL),
  name: () => screen.queryByLabelText(LABELS.NAME.LABEL),
  description: () => screen.queryByLabelText(LABELS.DESCRIPTION.LABEL),
  privileges: () => screen.queryByRole('group', {name: LABELS.PRIVILEGES.SELECTED}),
  roles: () => screen.queryByRole('group', {name: LABELS.ROLES.SELECTED}),
  readOnly: {
    id: () => screen.getByText(LABELS.ID.LABEL).nextSibling,
    name: () => screen.getByText(LABELS.NAME.LABEL).nextSibling,
    description: () => screen.getByText(LABELS.DESCRIPTION.LABEL).nextSibling,
    privileges: () => screen.queryAllByRole('list')[0],
    roles: () => screen.queryAllByRole('list')[1],
  },
  cancelButton: () => screen.getByText(SETTINGS.CANCEL_BUTTON_LABEL),
  saveButton: () => screen.getByText(SETTINGS.SAVE_BUTTON_LABEL),
  deleteButton: () => screen.getByText(SETTINGS.DELETE_BUTTON_LABEL),
};

const clickOnPrivileges = privileges => privileges.forEach(it => fireEvent.click(screen.getByText(it)));
const clickOnRoles = roles => roles.forEach(it => fireEvent.click(screen.getByText(ROLES[it].name)));

describe('RolesDetails', function() {
  const CONFIRM = Promise.resolve();
  const onDone = jest.fn();

  function renderDetails(itemId) {
    return render(<RolesDetails itemId={itemId || ''} onDone={onDone}/>);
  }

  beforeEach(() => {
    when(Axios.get).calledWith(defaultRolesUrl).mockResolvedValue({data: Object.values(ROLES)});
    when(Axios.get).calledWith(privilegesUrl).mockResolvedValue({data: PRIVILEGES});
    when(Axios.get).calledWith(singleRoleUrl(testRoleId)).mockResolvedValue({data: {...ROLE, readOnly: false}});
    when(Axios.post).calledWith('/service/extdirect', expect.objectContaining(sourcesApi))
        .mockResolvedValue({data: SOURCE_TYPES_RESP});
    ExtJS.checkPermission.mockReturnValue(true);
  });

  it('renders the resolved data', async function() {
    const {id, name, queryLoadingMask, description, privileges, roles, saveButton} = selectors;

    renderDetails(testRoleId);
    await waitForElementToBeRemoved(queryLoadingMask());

    expect(id()).toHaveValue(testRoleId);
    expect(id()).toBeDisabled();
    expect(name()).toHaveValue(ROLE.name);
    expect(description()).toHaveValue(ROLE.description);

    ROLE.privileges.forEach(it => {
      expect(privileges()).toHaveTextContent(it);
    });
    ROLE.roles.forEach(it => {
      expect(roles()).toHaveTextContent(ROLES[it].name);
    });

    expect(saveButton()).toHaveClass('disabled');
  });

  it('renders load error message', async function() {
    const message = 'Load error message!';
    const {queryLoadingMask} = selectors;

    Axios.get.mockReturnValue(Promise.reject({message}));

    renderDetails(testRoleId);
    await waitForElementToBeRemoved(queryLoadingMask());

    expect(screen.getByRole('alert')).toHaveTextContent(message);
  });

  it('requires the ID and Name fields when creating a new internal role', async function() {
    const {type, id, name, queryLoadingMask, description, privileges, roles, saveButton} = selectors;
    renderDetails();
    await waitForElementToBeRemoved(queryLoadingMask());

    expect(id()).not.toBeInTheDocument();
    expect(name()).not.toBeInTheDocument();
    expect(description()).not.toBeInTheDocument();
    expect(roles()).not.toBeInTheDocument();
    expect(privileges()).not.toBeInTheDocument();
    expect(saveButton()).toHaveClass('disabled');

    userEvent.selectOptions(type(), TYPES.INTERNAL);
    expect(name()).toBeInTheDocument();
    expect(saveButton()).toHaveClass('disabled');

    await TestUtils.changeField(id, testRoleId);
    userEvent.clear(id());
    expect(screen.getByText(UIStrings.ERROR.FIELD_REQUIRED)).toBeInTheDocument();
    await TestUtils.changeField(id, testRoleId);
    expect(saveButton()).toHaveClass('disabled');

    await TestUtils.changeField(name, testRoleName);
    userEvent.clear(name());
    expect(screen.getByText(UIStrings.ERROR.FIELD_REQUIRED)).toBeInTheDocument();
    await TestUtils.changeField(name, testRoleName);
    expect(saveButton()).not.toHaveClass('disabled');
  });

  it('fires onDone when cancelled', async function() {
    const {queryLoadingMask, cancelButton} = selectors;
    renderDetails();
    await waitForElementToBeRemoved(queryLoadingMask());

    fireEvent.click(cancelButton());

    await waitFor(() => expect(onDone).toBeCalled());
  });

  it('requests confirmation when delete is requested', async function() {
    const {queryLoadingMask, deleteButton} = selectors;
    Axios.delete.mockReturnValue(Promise.resolve(null));

    renderDetails(testRoleId);
    await waitForElementToBeRemoved(queryLoadingMask());

    ExtJS.requestConfirmation.mockReturnValue(CONFIRM);
    fireEvent.click(deleteButton());

    await waitFor(() => expect(Axios.delete).toBeCalledWith(singleRoleUrl(testRoleId)));
    expect(onDone).toBeCalled();
    expect(ExtJS.showSuccessMessage).toBeCalled();
  });

  it('creates internal role', async function() {
    const {type, id, name, queryLoadingMask, description, saveButton} = selectors;

    when(Axios.post).calledWith(rolesUrl, ROLE).mockResolvedValue({data: {}});

    renderDetails();
    await waitForElementToBeRemoved(queryLoadingMask());

    userEvent.selectOptions(type(), TYPES.INTERNAL);
    await TestUtils.changeField(id, testRoleId);
    await TestUtils.changeField(name, testRoleName);
    await TestUtils.changeField(description, testRoleDescription);

    clickOnPrivileges(ROLE.privileges);
    clickOnRoles(ROLE.roles);

    expect(saveButton()).not.toHaveClass('disabled');
    fireEvent.click(saveButton());

    await waitFor(() => expect(Axios.post).toHaveBeenCalledWith(rolesUrl, ROLE));
    expect(NX.Messages.success).toHaveBeenCalledWith(UIStrings.SAVE_SUCCESS);
  });

  it('creates external role', async function() {
    const {type, name, queryLoadingMask, description, saveButton, externalRoleType, mappedRole} = selectors;
    const crowdType = SOURCE_TYPES.Crowd.id;
    const testCrowdRoleId = CROWD_ROLES[0].id;
    const externalRole = {...ROLE, id: testCrowdRoleId};

    when(Axios.get).calledWith(getRolesUrl(crowdType)).mockResolvedValue({data: CROWD_ROLES});
    when(Axios.post).calledWith(rolesUrl, externalRole).mockResolvedValue({data: {}});

    renderDetails();
    await waitForElementToBeRemoved(queryLoadingMask());

    userEvent.selectOptions(type(), TYPES.EXTERNAL);
    userEvent.selectOptions(externalRoleType(), crowdType);

    await waitFor(() => expect(Axios.get).toHaveBeenCalledWith(getRolesUrl(crowdType)));

    userEvent.selectOptions(mappedRole(), testCrowdRoleId);

    await TestUtils.changeField(name, testRoleName);
    await TestUtils.changeField(description, testRoleDescription);

    clickOnPrivileges(ROLE.privileges);
    clickOnRoles(ROLE.roles);

    expect(saveButton()).not.toHaveClass('disabled');
    fireEvent.click(saveButton());

    await waitFor(() => expect(Axios.post).toHaveBeenCalledWith(rolesUrl, externalRole));
    expect(NX.Messages.success).toHaveBeenCalledWith(UIStrings.SAVE_SUCCESS);
  });

  it('updates', async function() {
    const {name, description, queryLoadingMask, saveButton} = selectors;
    const data = {
      name: 'Updated name',
      description: 'Updated description',
      privileges: ['nx-all'],
      roles: ['TestRole'],
    };

    Axios.put.mockReturnValue(Promise.resolve());

    renderDetails(testRoleId);
    await waitForElementToBeRemoved(queryLoadingMask());

    await TestUtils.changeField(name, data.name);
    await TestUtils.changeField(description, data.description);

    clickOnPrivileges(ROLE.privileges);
    clickOnRoles(ROLE.roles);

    clickOnPrivileges(data.privileges);
    clickOnRoles(data.roles);

    expect(saveButton()).not.toHaveClass('disabled');
    fireEvent.click(saveButton());

    await waitFor(() => expect(Axios.put).toHaveBeenCalledWith(singleRoleUrl(testRoleId), {
      id: testRoleId,
      readOnly: false,
      ...data,
    }));
    expect(NX.Messages.success).toHaveBeenCalledWith(UIStrings.SAVE_SUCCESS);
  });

  it('shows save API errors', async function() {
    const message = "Use a unique roleId";
    const {type, id, name, queryLoadingMask, description, saveButton} = selectors;

    when(Axios.post).calledWith(rolesUrl, expect.objectContaining({name: testRoleName})).mockRejectedValue({
      response: {
        data: message,
      }
    });

    renderDetails();
    await waitForElementToBeRemoved(queryLoadingMask());

    userEvent.selectOptions(type(), TYPES.INTERNAL);
    await TestUtils.changeField(id, testRoleId);
    await TestUtils.changeField(name, testRoleName);
    await TestUtils.changeField(description, testRoleDescription);

    expect(saveButton()).not.toHaveClass('disabled');

    await act(async () => fireEvent.click(saveButton()));

    expect(NX.Messages.error).toHaveBeenCalledWith(UIStrings.ERROR.SAVE_ERROR);
    expect(screen.getByText(new RegExp(message))).toBeInTheDocument();
  });

  describe('Read Only Mode', function() {
    const shouldSeeDetailsInReadOnlyMode = () => {
      const {readOnly: {id, name, description, privileges, roles}} = selectors;

      expect(id()).toHaveTextContent(testRoleId);
      expect(name()).toHaveTextContent(testRoleName);
      expect(description()).toHaveTextContent(testRoleDescription);

      ROLE.privileges.forEach(it => {
        expect(privileges()).toHaveTextContent(it);
      });
      ROLE.roles.forEach(it => {
        expect(roles()).toHaveTextContent(ROLES[it].name);
      });
    };

    it('renders default role in Read Only Mode', async () => {
      const {queryLoadingMask} = selectors;
      const warning = () => screen.getByText(LABELS.DEFAULT_ROLE_WARNING);

      when(Axios.get).calledWith(singleRoleUrl(testRoleId)).mockResolvedValue({
        data: {...ROLE, readOnly: true}
      });

      renderDetails(testRoleId);
      await waitForElementToBeRemoved(queryLoadingMask());

      expect(warning()).toBeInTheDocument();
      shouldSeeDetailsInReadOnlyMode();
    });

    it('renders role details without edit permissions', async () => {
      const {queryLoadingMask} = selectors;
      const warning = () => screen.getByText(SETTINGS.READ_ONLY.WARNING);

      when(ExtJS.checkPermission).calledWith('nexus:roles:update').mockReturnValue(false);

      renderDetails(testRoleId);
      await waitForElementToBeRemoved(queryLoadingMask());

      expect(warning()).toBeInTheDocument();
      shouldSeeDetailsInReadOnlyMode();
    });
  });
});
