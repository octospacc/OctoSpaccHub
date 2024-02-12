const MbViewerTrasformapiSchema = `<schema>

<set
	rss-media-query="*[name()='media:content' or name()='enclosure']"
/>

<!-- WIP, find out how to structure this -->
<endpoint name="messages">
	<method name="GET" args="" returns="message[]"/>
	<!-- ... -->
</endpoint>

<entity name="message">
	<prop name="id" type="int">
		<content upstream="rss" query="./guid"/>
		<content upstream="wordpress.com" query="//ID"/>
		<content upstream="wordpress.org" query="//id"/>
		<content upstream="mastodon" query="//id"/>
	</prop>
	<prop name="url" type="string">
		<content upstream="rss" query="./link"/>
		<content upstream="wordpress.com" query="//URL"/>
		<content upstream="wordpress.org" query="//link"/>
		<content upstream="mastodon" query="//url"/>
	</prop>
	<prop name="title" type="string">
		<content upstream="rss" query="title"/>
		<content upstream="wordpress.com" query="//title"/>
		<content upstream="wordpress.org" query="//title/rendered"/>
	</prop>
	<prop name="content" type="string">
		<!-- TODO optional multiple 'query' attrs -->
		<!--<content upstream="rss" query="content:encoded"/>-->
		<content upstream="rss" query="./description"/>
		<content upstream="wordpress.com" query="//content"/>
		<content upstream="wordpress.org" query="//content/rendered"/>
		<content upstream="mastodon" query="//content"/>
	</prop>
	<prop name="attachments" type="file[]">
		<content upstream="rss">
			<prop name="url" query="{rss-media-query}/@url"/>
			<prop name="type" query="{rss-media-query}/@type"/>
			<prop name="description" query="{rss-media-query}/*[name()='media:description']"/>
		</content>
		<!--
		<content upstream="mastodon">
			<prop name="url" query="media_attachments.url"/>
			<prop name="type" query="media_attachments.type"/>
		</content>
		-->
		<content upstream="mastodon" query="//media_attachments"/>
	</prop>
	<prop name="author" type="profile">
		<content upstream="rss"/>
		<content upstream="wordpress.com" query="//author"/>
		<content upstream="wordpress.org"/>
		<content upstream="mastodon" query="//account"/>
	</prop>
	<prop name="time" type="string">
		<content upstream="rss" query="pubDate"/>
		<content upstream="wordpress.com" query="//date"/>
		<content upstream="wordpress.org" query="//date"/>
		<content upstream="mastodon" query="//created_at"/>
	</prop>
	<prop name="revisions" type="revision[]">
		<content upstream="wordpress.com"/>
		<content upstream="wordpress.org"/>
		<content upstream="mastodon"/>
	</prop>
	<prop name="quoting" type="message">
		<content upstream="mastodon" query="//reblog"/>
	</prop>
	<!--<prop name="replying" type="message">
		<content upstream="mastodon" query=""/>
	</prop>-->
</entity>

<entity name="revision">
	<prop name="time" type="string">
		<content upstream="wordpress.com" query="//modified"/>
		<content upstream="wordpress.org" query="//modified"/>
		<content upstream="mastodon" query="//edited_at"/>
	</prop>
</entity>

<!-- TODO (for wordpress) how to handle both authors and sites as a profile type? maybe add a 'variant' attr for 'content' tags? -->
<entity name="profile">
	<prop name="id" type="int"> <!-- TODO fix type -->
		<content upstream="rss" query="link"/>
		<content upstream="wordpress.com" query="//ID"/>
		<content upstream="wordpress.org" query="//author"/>
	</prop>
	<prop name="url" type="string">
		<content upstream="rss" query="link"/>
		<content upstream="wordpress.com" query="//profile_URL"/>
	</prop>
	<prop name="name" type="string">
		<content upstream="rss" query="*[name()='title' or name()='dc:creator']"/>
		<content upstream="wordpress.com" query="//name"/>
		<content upstream="mastodon" query="//title"/>
	</prop>
	<prop name="description" type="string">
		<content upstream="rss" query="description"/>
		<content upstream="mastodon" query="//description"/>
	</prop>
	<prop name="icon" type="file">
		<content upstream="rss">
			<prop name="url" query="image/url"/>
		</content>
		<content upstream="wordpress.com">
			<prop name="url" query="//avatar_URL"/>
		</content>
		<content upstream="mastodon"> <!-- TODO read user avatars -->
			<!--<prop name="url" query="//thumbnail/url"/>-->
			<prop name="url" query="//contact/account/avatar"/>
		</content>
	</prop>
</entity>

<entity name="file">
	<prop name="url" type="string">
		<content upstream="mastodon" query="//url"/>
	</prop>
	<prop name="type" type="string">
		<content upstream="mastodon" query="//type"/>
	</prop>
	<prop name="description" type="string"/>
</entity>

</schema>`;
