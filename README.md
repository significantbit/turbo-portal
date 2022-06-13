# @sigbit/turbo-portal
> Create Turbo Frames to render content inside modals and slideovers with ease.

## How does it work?
This module will intercept `@hotwired/turbo` links and load the requested page inside the target element and emit a `turbo-portal:load` event whenever it's rendered. If a successful form submission is performed inside the frame, the `turbo-portal:unload` event will be triggered. Both these events may be used by e.g. `@hotwired/stimulus` controllers to open/close modals, slideovers etc.

## Install
```
$ yarn add significantbit/turbo-portal
```

## Get started
`frontend/application.js`
```js
import * as Turbo from '@hotwired/turbo'
import * as TurboPortal from '@sigbit/turbo-portal'

Turbo.start()
TurboPortal.start()
```

## Native \<dialog> example
`views/tasks/index.html`
```erb
<%= link_to "Create a new task",
  new_task_path,
  target: 'dialog', # Portal target element
  data: {
    remote_target: 'container', # Target frame on new page
    local_target: 'tasks tasks_count' # Reload local frames after submission
  } %>

<turbo-frame id="tasks_count">
  <%= @tasks.count %>
</turbo-frame>

<turbo-frame id="tasks">
  <% @tasks.each do |task| %>
    <div><%= task.title %></div>
  <% end %>
</turbo-frame>

<dialog data-controller="my-dialog">
  <button data-action="click->dialog#close">Close</button>
  <turbo-frame id="dialog" />
</dialog>
````

`views/tasks/new.html`
```erb
<turbo-frame id="container">
  <!-- ... -->
</turbo-frame>
```

`frontend/controllers/my_dialog_controller.js`
```js
import { Controller } from '@hotwired/stimulus'

export default class extends Controller {
  connect() {
    this.element.addEventListener('turbo-portal:load', this.element.showModal)
    this.element.addEventListener('turbo-portal:unload', this.element.close)
  }

  close () {
    this.element.close()
  }
}
```