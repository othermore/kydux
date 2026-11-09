wizard.cast("kirra")
key = wizard.find_nearest("key")
right = key.position.x - wizard.position.x
down = key.position.y - wizard.position.y
wizard.move_right(right)
wizard.move_down(down)
wizard.pick_up()
store_door.open()
