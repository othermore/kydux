wizard.cast("kirra")
key = wizard.find_nearest("key")
right = key.position.y - wizard.position.y
down = key.position.x - wizard.position.x
wizard.move_right(right)
wizard.move_down(down)
wizard.pick_up()
right = store_door.position.x - wizard.position.x
down = store_door.position.y - 1 - wizard.position.y
wizard.move_right(right)
wizard.move_down(down)
store_door.open()
