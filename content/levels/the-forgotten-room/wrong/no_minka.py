pimu.go_to(10, 8)
pimu.go_to(13, 8)
pimu.go_to(13, 3)
for thread in wizard.find_all("thread"):
    pimu.go_to(thread.position.x, thread.position.y)
