FROM sonatype/nexus3:3.39.0 as nexus_source

FROM openjdk:8 as builder
RUN mkdir -p /tmp/workspace /tmp/target
COPY . /tmp/workspace
WORKDIR /tmp/workspace
RUN ./mvnw clean install -DskipTests -pl :nexus-base -am
RUN ./mvnw install -DskipTests -pl :nexus-core -am
RUN cp /tmp/workspace/components/nexus-base/target/nexus-base-3.39.0-01.jar /tmp/target
RUN cp /tmp/workspace/components/nexus-core/target/nexus-core-3.39.0-01.jar /tmp/target

FROM sonatype/nexus3:3.39.0
RUN whoami
USER root
COPY --from=builder /tmp/target/nexus-base-3.39.0-01.jar /opt/sonatype/nexus/system/org/sonatype/nexus/nexus-base/3.39.0-01/nexus-base-3.39.0-01.jar
COPY --from=builder /tmp/target/nexus-core-3.39.0-01.jar /opt/sonatype/nexus/system/org/sonatype/nexus/nexus-core/3.39.0-01/nexus-core-3.39.0-01.jar
USER nexus

