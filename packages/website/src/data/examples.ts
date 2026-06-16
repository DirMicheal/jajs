export interface ExampleCode {
  id: string;
  name: string;
  description: string;
  code: string;
}

export const EXAMPLES: ExampleCode[] = [
  {
    id: 'hello-world',
    name: 'Hello World',
    description: '经典的 Hello World 程序',
    code: `public class HelloWorld {
    private String name;

    public HelloWorld(String name) {
        this.name = name;
    }

    public void sayHello() {
        String message = "Hello, " + this.name + "!";
        System.out.println(message);
    }

    public static void main(String[] args) {
        HelloWorld hw = new HelloWorld("JaJS");
        hw.sayHello();
    }
}`,
  },
  {
    id: 'calculator',
    name: '计算器类',
    description: '演示类、方法和运算符',
    code: `public class Calculator {
    private double result;

    public Calculator() {
        this.result = 0.0;
    }

    public void add(double value) {
        this.result = this.result + value;
    }

    public void subtract(double value) {
        this.result = this.result - value;
    }

    public void multiply(double value) {
        this.result = this.result * value;
    }

    public void divide(double value) {
        if (value != 0) {
            this.result = this.result / value;
        }
    }

    public double getResult() {
        return this.result;
    }

    public static void main(String[] args) {
        Calculator calc = new Calculator();
        calc.add(10);
        calc.multiply(2);
        calc.subtract(5);
        System.out.println(calc.getResult());
    }
}`,
  },
  {
    id: 'inheritance',
    name: '继承与多态',
    description: '演示类继承和方法重写',
    code: `public class Animal {
    protected String name;

    public Animal(String name) {
        this.name = name;
    }

    public void makeSound() {
        System.out.println("Some sound");
    }

    public String getName() {
        return this.name;
    }
}

public class Dog extends Animal {
    private String breed;

    public Dog(String name, String breed) {
        super(name);
        this.breed = breed;
    }

    @Override
    public void makeSound() {
        System.out.println("Woof! Woof!");
    }

    public String getBreed() {
        return this.breed;
    }

    public static void main(String[] args) {
        Animal dog = new Dog("Buddy", "Golden Retriever");
        dog.makeSound();
        System.out.println(dog.getName());
    }
}`,
  },
  {
    id: 'fibonacci',
    name: '斐波那契数列',
    description: '演示循环和条件判断',
    code: `public class Fibonacci {
    public static int fibonacci(int n) {
        if (n <= 1) {
            return n;
        }
        int prev = 0;
        int curr = 1;
        for (int i = 2; i <= n; i++) {
            int next = prev + curr;
            prev = curr;
            curr = next;
        }
        return curr;
    }

    public static void main(String[] args) {
        for (int i = 0; i < 10; i++) {
            int result = Fibonacci.fibonacci(i);
            System.out.println("F(" + i + ") = " + result);
        }
    }
}`,
  },
  {
    id: 'try-catch',
    name: '异常处理',
    description: '演示 try-catch-finally 异常处理',
    code: `public class ExceptionDemo {
    public static int divide(int a, int b) {
        if (b == 0) {
            throw new Error("Cannot divide by zero");
        }
        return a / b;
    }

    public static void main(String[] args) {
        try {
            int result = ExceptionDemo.divide(10, 0);
            System.out.println("Result: " + result);
        } catch (Error e) {
            System.out.println("Error: " + e.message);
        } finally {
            System.out.println("Execution completed");
        }

        try {
            int result = ExceptionDemo.divide(10, 2);
            System.out.println("Result: " + result);
        } catch (Error e) {
            System.out.println("Error: " + e.message);
        }
    }
}`,
  },
  {
    id: 'type-error',
    name: '类型错误示例',
    description: '演示类型检查器捕获的错误',
    code: `public class TypeDemo {
    public static void main(String[] args) {
        int x = "hello";
        String y = 123;
        int z = x + y;
    }
}`,
  },
];
