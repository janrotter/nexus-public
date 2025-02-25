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
package org.sonatype.nexus.repository.httpbridge.internal;

import javax.inject.Named;

import org.sonatype.nexus.common.app.FeatureFlag;
import org.sonatype.nexus.security.FilterChainModule;
import org.sonatype.nexus.security.SecurityFilter;
import org.sonatype.nexus.security.anonymous.AnonymousFilter;
import org.sonatype.nexus.security.authc.AntiCsrfFilter;
import org.sonatype.nexus.security.authc.NexusAuthenticationFilter;
import org.sonatype.nexus.security.authc.apikey.ApiKeyAuthenticationFilter;

import com.google.inject.AbstractModule;

import static org.sonatype.nexus.common.app.FeatureFlags.SESSION_ENABLED;

/**
 * Repository HTTP bridge module.
 *
 * @since 3.0
 */
@Named
@FeatureFlag(name = SESSION_ENABLED)
public class HttpBridgeModule
    extends AbstractModule
{
  public static final String MOUNT_POINT = "/repository";

  public static final String DOCKER_V1_MOUNT_POINT = "/v1";

  public static final String DOCKER_V2_MOUNT_POINT = "/v2";

  @Override
  protected void configure() {
    install(new HttpBridgeServletModule()
    {
      @Override
      protected void bindSecurityFilter(final FilterKeyBindingBuilder filter) {
        filter.through(SecurityFilter.class);
      }
    });

    String[] filterChain = {
        NexusAuthenticationFilter.NAME,
        ApiKeyAuthenticationFilter.NAME,
        AnonymousFilter.NAME,
        AntiCsrfFilter.NAME
    };

    installFilterChain(filterChain);
  }

  protected void installFilterChain(final String[] filterChain) {
    String[] mountPoints = new String[]{
        MOUNT_POINT,
        DOCKER_V1_MOUNT_POINT,
        DOCKER_V2_MOUNT_POINT
    };

    for (String mountPoint : mountPoints) {
      install(new FilterChainModule()
      {
        @Override
        protected void configure() {
          addFilterChain(mountPoint + "/**", filterChain);
        }
      });
    }
  }
}
