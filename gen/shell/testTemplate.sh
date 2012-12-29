#!/bin/bash

url=$1
script=$2;
      
total_test_failed=0
total_test_passed=0
total_test_skipped=0

test_num=0

<%for(var testName in TestCases){ %>

  echo Running test case: <%=testName%> 
  <% var testCase = TestCases[testName]; %>
  <% for(var taskIndex in testCase.tasks){ %>
      <% var task = testCase.tasks[taskIndex] %>
      args="" 
      <% for(var paramName in task.inputObject){ %>
        args="$args --<%=paramName%> <%=task.inputObject[paramName]%>"
      <% } %>
            
      test_num=`expr $test_num + 1`

      echo -n "#${test_num} Running tests on <%= task.funcName %>..."

      log=".test_${test_num}.log"
       
      rm -rf .stdout.log .stderr.log
      rm -rf $log

      touch $log
 
      #echo "$script <%= task.funcName %> --APIURL $url $args 1>stdout.log 2>stderr.log"
      $script <%= task.funcName %> --APIURL $url $args 1>.stdout.log 2>.stderr.log
       
      test_failed=0
      test_passed=0
      test_skipped=0
 
      <% for(var testIndex in task.test){ %>
        <% var test=task.test[testIndex]; %>
        <% if(test.type=="noError"){%>
          if [  -s .stderr.log ]; then
            echo "F - An unexpected error was recieved:" >> $log
            test_failed=`expr $test_failed + 1`
          else
            echo "P - No error was recieved" >> $log
            test_passed=`expr $test_passed + 1`
          fi 
        <% } else if(test.type=="outputNotNull"){ %>
          if [ ! -s .stdout.log ]; then
            echo "F - Output appears to be null" >> $log
            test_failed=`expr $test_failed + 1` 
          else
            echo "P - Output was not null" >> $log
            test_passed=`expr $test_passed + 1`
          fi 
        <% } else if(test.type=="errorContains"){ %>
          if grep "<%=test.expectedError%>" .stderr.log ; then
            echo "F - Expected an error containing: <%=test.expectedError%>" >> $log
            test_failed=`expr $test_failed + 1`
          else
            echo "P - Error contained: <%=test.expectedError%>" >> $log
            test_passed=`expr $test_passed + 1`
          fi
        <% } else { %>
            echo "S - Unable to run test '<%=test.type%>'" >> $log
            test_skipped=`expr $test_skipped + 1`
        <% } %>
      <% } %> 
      echo " Tests (passed ${test_passed} / failed ${test_failed} / skipped ${test_skipped})"
      cat $log | sed "s/^/    /g"
      if [ ${test_failed} != "0" ] ; then  
        echo
        echo "    ----------------------------------"
        echo "    Output was:"
        cat .stdout.log | sed "s/^/     >/g"
        echo "    Error was:"
        cat .stderr.log | sed "s/^/     >/g"
      fi
  
      total_test_failed=`expr $test_failed + $total_test_failed`
      total_test_passed=`expr $test_passed + $total_test_passed`
      total_test_skipped=`expr $test_skipped + $total_test_skipped`
     
      echo  
  <%}%>
  echo " Tests (passed ${total_test_passed} / failed ${total_test_failed} / skipped ${total_test_skipped})"
  
<% } %>
