self.addEventListener('push', function (event) {
    const data = event.data.json();
    const options = {
        body: data.body,
        tag: 'chat-notifications',
        renotify: true,
        icon: "/android-chrome-144x144.png",
        data: { url: data.url },
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    const targetUrl = event.notification.data?.url;

    // Open the target URL in a new window/tab
    if (targetUrl) {
        event.waitUntil(
            clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
                // Check if the URL is already open in any tab
                const client = clientList.find((c) => c.url === targetUrl && "focus" in c);

                if (client) {
                    // Focus the tab if already open
                    return client.focus();
                }

                // Otherwise, open a new tab
                if (clients.openWindow) {
                    return clients.openWindow(targetUrl);
                }
            })
        );
    }
});