#!/bin/bash


if ! which curl > /dev/null ; then 
  echo "Please make sure that 'curl' is installed"
  exit -1;
fi

APIURL=""
call=$1
shift

curlargs='-H Accept:application/json -s -S'
options=$@
arguments=($options)
index=0;

#Load any predefined variables from ~/.hopjs
if [ -f ~/.hopjs ]; then
  source ~/.hopjs
fi

for argument in $options
  do
    index=`expr $index + 1`
    case $argument in
      --APIURL) APIURL=${arguments[index]}; ;;
    esac
  done

options=$@
arguments=($options)
index=0;

if [ -z "$APIURL" ]; then
  echo "No url specified, please use --APIURL to specify a URL or define a url in ~/.hopjs as 'APIURL=...'"
  exit -1
fi

# Remove the trailing slash from the URL
APIURL=`echo ${APIURL} | sed s/\\\/$//`

case "$call" in
  <% for(var i in Objects){ %>
    <% var object = Objects[i]; %>
		<% for(var j in object.methods){ %>
      <% var method = object.methods[j]; %>

      <%=object.name+"."+method.name%>) 
        APIURL="${APIURL}<%= (api.basePath+method.fullPath).replace("\/\/","\/") %>"
        args=""
        for argument in $options
          do
            index=`expr $index + 1`
            case $argument in
              <% for(var paramName in method.params) {%>
                <% var param = method.params[paramName]; %>
                --<%=paramName%>) <%=paramName%>=${arguments[index]}; ;; 
              <% } %>
              --showHelp) 
                echo "<%=object.name+"."+method.name%> <%=method.desc||""%>"
                echo "<%=method.method.toUpperCase()%> ${APIURL}"
                echo
                <% for(var paramName in method.params) {%>
                  <% var param = method.params[paramName]; %>
                  echo --<%=paramName%><%=(param.required?"*":"")%><%="\t"+(param.desc||"")%>
                <% } %>
                exit 0;
              ;;
            esac
          done
        <% for(var paramName in method.params) {%>
          <% var param = method.params[paramName]; %>
          <% if(param.demand){ %>
            if [ -z "${<%=paramName%>}" ]; then
              echo "Missing required parameter: <%=paramName%>" 1>&2
              exit -2
            fi 
          <% } %> 
          <% if(method.fullPath.indexOf(":"+paramName)!=-1) { %>
            APIURL=`echo $APIURL | sed s/:<%=paramName%>/${<%=paramName%>}/` 
          <% } else {%>
            args="${args}<%=paramName%>=${<%=paramName%>}&"
          <% } %> 
        <% } %>
        args=`echo ${args} | sed s/\&$//`
        <% if(method.method=='get'){ %>
          cmd="curl ${curlargs} ${APIURL}?${args}"
        <% } else if(method.method=='put'){ %>
          cmd="curl ${curlargs} -XPUT --data ${args} ${APIURL}"
        <% } else if(method.method=='post'){ %>
          cmd="curl ${curlargs} --data ${args} ${APIURL}"
        <% } else if(method.method=='del'){ %>
          cmd="curl ${curlargs} -XDELETE ${APIURL}?${args}"
        <% } %>
        $cmd
      ;;
		<% } %>
  <% } %>
  *) 
    echo "Usage: $0 API.call --param foo"
    echo "Available APIs:"
    echo "-----------------------------------------------"
    <% for(var objName in Objects){ %>
      <% for(var methodName in Objects[objName].methods){ %>
        <% var method = Objects[objName].methods[methodName] %>
        echo <%=objName+"."+methodName%><%="\t"+(method.desc||"")%>
      <%}%>
    <%}%>
    echo
    echo
    echo "Use --showHelp with a specified command to see the associated parameters"
  ;;
esac
