using System;
using System.Reflection;
using Autofac;

namespace MyApp
{
	public class Program
	{
		static void Main (string[] args)
		{
			var builder = new ContainerBuilder ();
			builder.RegisterAssemblyTypes (Assembly.GetExecutingAssembly ())
				.AsSelf ()
				.AsImplementedInterfaces ();

			var container = builder.Build ();

			var provider = container.Resolve<MessageProvider> ();

			Console.WriteLine(provider.Message);
		}
	}

	public class MessageProvider
	{
		public string Message
		{
			get { return "Hello World!"; }
		}
	}
}
