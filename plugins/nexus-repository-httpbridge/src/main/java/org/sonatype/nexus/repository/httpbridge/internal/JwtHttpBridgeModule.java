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
import org.sonatype.nexus.security.JwtFilter;
import org.sonatype.nexus.security.JwtSecurityFilter;
import org.sonatype.nexus.security.anonymous.AnonymousFilter;
import org.sonatype.nexus.security.authc.AntiCsrfFilter;
import org.sonatype.nexus.security.authc.NexusAuthenticationFilter;
import org.sonatype.nexus.security.authc.apikey.ApiKeyAuthenticationFilter;

import static org.sonatype.nexus.common.app.FeatureFlags.JWT_ENABLED;

/**
 * Repository HTTP bridge module using {@link JwtSecurityFilter}.
 *
 * @since 3.38
 */
@Named
@FeatureFlag(name = JWT_ENABLED)
public class JwtHttpBridgeModule
  extends HttpBridgeModule
{
  @Override
  protected void configure() {
    install(new HttpBridgeServletModule()
    {
      @Override
      protected void bindSecurityFilter(final FilterKeyBindingBuilder filter) {
        filter.through(JwtSecurityFilter.class);
      }
    });

    String[] filterChain = {
        NexusAuthenticationFilter.NAME,
        JwtFilter.NAME,
        ApiKeyAuthenticationFilter.NAME,
        AnonymousFilter.NAME,
        AntiCsrfFilter.NAME
    };

    installFilterChain(filterChain);
  }
}
