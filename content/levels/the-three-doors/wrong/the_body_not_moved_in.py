for step in range(3):
next_door = wizard.find_nearest("door")
next_door.open()
wizard.move_up(4)
