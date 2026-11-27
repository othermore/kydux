my_key = wizard.find_nearest("key")
right = my_key.position.x - wizard.position.x
down = my_key.position.y - wizard.position.y
wizard.move_right(right)
wizard.move_down(down)
wizard.pick_up()
right = store_door.position.x - wizard.position.x
down = store_door.position.y - 1 - wizard.position.y
wizard.move_right(right)
wizard.move_down(down)
store_door.open()
