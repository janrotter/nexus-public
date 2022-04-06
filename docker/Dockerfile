FROM sonatype/nexus3:3.38.0 as nexus_source

FROM openjdk:8 as jar_mangler
RUN mkdir -p /tmp/nexus_orig /tmp/nexus_modified
COPY --from=nexus_source /opt/sonatype/nexus/system/org/sonatype/nexus/nexus-base/3.38.0-01/nexus-base-3.38.0-01.jar /tmp/nexus_orig
COPY nexus-base-3.38.0-01.jar /tmp/nexus_modified
WORKDIR /tmp
RUN jar xf nexus_modified/nexus-base-3.38.0-01.jar org/sonatype/nexus/internal/security/model/orient/OrientCUserRoleMappingEntityAdapter.class
RUN ls
RUN ls nexus_modified
RUN jar uf nexus_orig/nexus-base-3.38.0-01.jar org
#-C org/sonatype/nexus/internal/security/model/orient OrientCUserRoleMappingEntityAdapter.class

FROM sonatype/nexus3:3.38.0
RUN whoami
USER root
COPY --from=jar_mangler /tmp/nexus_orig/nexus-base-3.38.0-01.jar /opt/sonatype/nexus/system/org/sonatype/nexus/nexus-base/3.38.0-01/nexus-base-3.38.0-01.jar
USER nexus

