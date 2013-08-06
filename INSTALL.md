Adapted from:
http://dcvan24.wordpress.com/2013/05/16/how-to-deploy-solr-4-3-on-jetty-9/

# Quick review of steps for server-side installation:

### JAVA INSTALLATION

1. If it isn't already, make sure to install JDK 7. This is required for Jetty, the servlet engine that runs Solr. If you already have a Java version 7+ installed, skip to step two.
```Shell
## On Ubuntu
sudo apt-get install openjdk-7-jdk
mkdir -p /usr/java
ln -s /usr/lib/jvm/java-7-openjdk-amd64 /usr/java/default
echo "export JAVA_HOME=/usr/java/default" >> ~/.profile
```

2. Download both Solr and Jetty. In our implementation, we used Solr 4.4.0 and Jetty 9.0.4.
Solr: http://lucene.apache.org/solr/mirrors-solr-latest-redir.html
Jetty: http://download.eclipse.org/jetty/stable-9/dist/
### JETTY INSTALLATION

3. Extract Jetty (recommended `/opt`), set its home environment, create its user and chown the files. Note: version numbers may differ.
```Shell
sudo tar -zxvf jetty-distribution-9.0.3.v20130506.tar.gz -C /opt
sudo mv /opt/jetty-distribution-9.0.3.v20130506/ /opt/jetty/
echo "export JETTY_HOME=/opt/jetty/" >> ~/.profile
sudo useradd jetty -U -s /bin/false
sudo chown -R jetty:jetty /opt/jetty
```
4. Copy the included shell script that will allow Jetty to run as a service.
```Shell
sudo cp -a /opt/jetty/bin/jetty.sh /etc/init.d/jetty
```
5. Using your favorite text editor, create the file /etc/default/jetty with the following contents: 
```
JAVA_HOME=/usr/java/default	 # Path to Java
NO_START=0					 # Start on boot
JETTY_HOST=0.0.0.0 		 	 # Listen to all hosts
JETTY_USER=jetty			 # Run as this user
```
6. To change the default port from 8080, edit the `/opt/jetty/start.ini` config file in the `HTTP Connector` section.

7. Start the Jetty service, and if desired, also have it start itself at boot:
```Shell
sudo service jetty start
sudo update-rc.d jetty defaults
```
### SOLR INSTALLATION

8. Extract the downloaded file from step 2 anywhere. Suggested location is /tmp since we won't need the files after moving them.
```Shell
tar -zxvf solr-4.4.0.tgz -C /tmp
```
9. From the extracted location, copy the `.war` java package into the Jetty webapps folder, the example database setup, and other Java required files.
```Shell
sudo cp -a solr-4.4.0/dist/solr-4.4.0.war /opt/jetty/webapps/solr.war
sudo cp -a solr-4.4.0/example/solr /opt/solr
sudo cp -a solr-4.4.0/dist /opt/solr
sudo cp -a solr-4.4.0/contrib /opt/solr
sudo cp -a solr-4.4.0/example/contexts/solr-jetty-context.xml /opt/jetty/webapps/solr.xml
sudo cp -a solr-4.4.0/example/lib/ext/* /opt/jetty/lib/ext/
```
10. Add the configuration for Solr to the default Jetty options file.
```Shell
sudo echo JAVA_OPTIONS="-Dsolr.solr.home=/opt/solr $JAVA_OPTIONS" >> /etc/default/jetty
```
11. Since we have somewhat reorganized the file structure of Solr and its exmaple setup, the configuration file for "collection1" needs to be updated to have relative paths pointing to the proper location. Change lines 75-85 of `/opt/solr/collection1/conf/solrconfig.xml` to look like the following: 
```XML
<lib dir="../../contrib/extraction/lib" regex=".*\.jar" />
<lib dir="../../dist/" regex="solr-cell-\d.*\.jar" />
<lib dir="../../contrib/clustering/lib/" regex=".*\.jar" />
<lib dir="../../dist/" regex="solr-clustering-\d.*\.jar" />
<lib dir="../../contrib/langid/lib/" regex=".*\.jar" />
<lib dir="../../dist/" regex="solr-langid-\d.*\.jar" />
<lib dir="../../contrib/velocity/lib" regex=".*\.jar" />
<lib dir="../../dist/" regex="solr-velocity-\d.*\.jar" />
```
12. Make Jetty the owner of the Solr installation.
```Shell
sudo chown -R jetty:jetty /opt/solr
```
13. Restart Jetty
```Shell
sudo service jetty restart
```

You can then access the web admin console of the Solr installation at `http://localhost:<configured port>/solr`

