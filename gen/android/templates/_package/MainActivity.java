package <%=package%>;

import org.hopjs.android.RESTStub;


public class MainActivity extends Activity {
	RESTStub rs = null;

	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);

		setContentView(R.layout.activity_main);
		rs = new RESTStub(this, "<%=url.replace(/\/$/, "")%>");
	}

	protected void onStart() {
		super.onStart();
		// Bind to the service
		rs.bind();
	}

	@Override
	protected void onStop() {
		super.onStop();
		// Unbind from the service
		rs.unbind();
	}
}
